<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index($listId)
    {
        $categories = Category::where('list_id', $listId)
            ->orderBy('name', 'asc')
            ->get();
        
        return response()->json($categories);
    }

    public function store(Request $request, $listId)
    {
        $this->validate($request, [
            'name' => 'required|string|max:100',
            'color' => 'required|string|max:50',
        ]);

        $category = Category::create([
            'list_id' => $listId,
            'name' => $request->input('name'),
            'color' => $request->input('color'),
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, $listId, $id)
    {
        $category = Category::where('list_id', $listId)
            ->where('id', $id)
            ->firstOrFail();

        if ($request->has('name')) {
            $category->name = $request->input('name');
        }

        if ($request->has('color')) {
            $category->color = $request->input('color');
        }

        $category->save();

        return response()->json($category);
    }

    public function destroy($listId, $id)
    {
        $category = Category::where('list_id', $listId)
            ->where('id', $id)
            ->firstOrFail();

        $category->delete();

        return response()->json(['message' => 'Category deleted'], 200);
    }
}
